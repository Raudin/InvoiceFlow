package handlers

import (
	"fmt"
	"net/http"
	"sort"
	"sync"
	"time"

	"invoiceflow/database"
	"invoiceflow/middleware"
	"invoiceflow/models"
	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

type SummaryPeriod struct {
	Month int `json:"month" binding:"required,min=1,max=12"`
	Year  int `json:"year" binding:"required"`
}

type BatchSummaryRequest struct {
	CustomerIDs []uint          `json:"customer_ids" binding:"required,min=1"`
	Periods     []SummaryPeriod `json:"periods" binding:"required,min=1"`
}

type BatchMonthData struct {
	CustomerID   uint
	CustomerName string
	Period       SummaryPeriod
	Transactions []models.Transaction
	Error        error
}

// ExportMultiMonthSummary generates an Excel file with multiple sheets (one per customer/month combination)
func ExportMultiMonthSummary(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	var req BatchSummaryRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	// Fetch all requested customers to verify ownership and get names
	var customers []models.Customer
	if err := database.DB.Where("id IN ? AND tenant_id = ?", req.CustomerIDs, tenantID).Find(&customers).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch customers")
		return
	}

	if len(customers) != len(req.CustomerIDs) {
		utils.ErrorResponse(c, http.StatusBadRequest, "One or more invalid customer IDs")
		return
	}

	// Map to easily get customer names by ID
	customerNames := make(map[uint]string)
	for _, cust := range customers {
		customerNames[cust.ID] = cust.Name
	}

	// Use Goroutines to fetch data for all combinations concurrently
	var wg sync.WaitGroup
	dataChan := make(chan BatchMonthData, len(req.CustomerIDs)*len(req.Periods))

	for _, custID := range req.CustomerIDs {
		for _, p := range req.Periods {
			wg.Add(1)
			go func(cID uint, period SummaryPeriod) {
				defer wg.Done()

				startDate := time.Date(period.Year, time.Month(period.Month), 1, 0, 0, 0, 0, time.Local)
				endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

				var transactions []models.Transaction
				err := database.DB.Where("tenant_id = ? AND customer_id = ? AND date >= ? AND date <= ?",
					tenantID, cID, startDate, endDate).
					Preload("Item").
					Find(&transactions).Error

				dataChan <- BatchMonthData{
					CustomerID:   cID,
					CustomerName: customerNames[cID],
					Period:       period,
					Transactions: transactions,
					Error:        err,
				}
			}(custID, p)
		}
	}

	wg.Wait()
	close(dataChan)

	// Collect results
	results := make([]BatchMonthData, 0)
	for d := range dataChan {
		if d.Error != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("Failed to fetch data for %s at %d/%d", d.CustomerName, d.Period.Month, d.Period.Year))
			return
		}
		results = append(results, d)
	}

	// Sort results: Customer Name -> Year -> Month
	sort.Slice(results, func(i, j int) bool {
		if results[i].CustomerName != results[j].CustomerName {
			return results[i].CustomerName < results[j].CustomerName
		}
		if results[i].Period.Year != results[j].Period.Year {
			return results[i].Period.Year < results[j].Period.Year
		}
		return results[i].Period.Month < results[j].Period.Month
	})

	// Create Excel file
	f := excelize.NewFile()
	defer f.Close()

	months := []string{"", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}

	existingSheetNames := make(map[string]struct{})

	for i, data := range results {
		// Sheet Name: CustomerName_MonthYear (Max 31 chars)
		baseName := fmt.Sprintf("%s_%s%d", data.CustomerName, months[data.Period.Month], data.Period.Year)
		if len(baseName) > 31 {
			baseName = baseName[:31]
		}

		sheetName := baseName
		if _, exists := existingSheetNames[sheetName]; exists {
			// Ensure unique sheet names by appending a numeric suffix while respecting the 31-character limit.
			for suffix := 1; ; suffix++ {
				suffixStr := fmt.Sprintf("-%d", suffix)
				maxBaseLen := 31 - len(suffixStr)
				trimmedBase := baseName
				if len(trimmedBase) > maxBaseLen {
					trimmedBase = trimmedBase[:maxBaseLen]
				}
				candidate := trimmedBase + suffixStr
				if _, used := existingSheetNames[candidate]; !used {
					sheetName = candidate
					existingSheetNames[candidate] = struct{}{}
					break
				}
			}
		} else {
			existingSheetNames[sheetName] = struct{}{}
		}

		var index int
		var err error
		if i == 0 {
			f.SetSheetName("Sheet1", sheetName)
			index, _ = f.GetSheetIndex(sheetName)
		} else {
			index, err = f.NewSheet(sheetName)
			if err != nil {
				continue
			}
		}

		// Header styling
		headerStyle, _ := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{Bold: true, Size: 14},
		})

		tableHeaderStyle, _ := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{Bold: true},
			Fill: excelize.Fill{Type: "pattern", Color: []string{"F1F5F9"}, Pattern: 1},
			Border: []excelize.Border{
				{Type: "bottom", Color: "CBD5E1", Style: 1},
				{Type: "top", Color: "CBD5E1", Style: 1},
			},
		})

		// Write info
		f.SetCellValue(sheetName, "A1", data.CustomerName)
		f.SetCellValue(sheetName, "A2", fmt.Sprintf("Report: %s %d", months[data.Period.Month], data.Period.Year))
		f.SetCellStyle(sheetName, "A1", "A2", headerStyle)

		// Prepare data matrix
		itemsMap := make(map[string]bool)
		datesMap := make(map[string]time.Time)
		dataMatrix := make(map[string]map[string]int)

		for _, t := range data.Transactions {
			itemName := "Unknown Item"
			if t.Item.Name != "" {
				itemName = t.Item.Name
			}
			dateStr := t.Date.Format("02/01/2006")

			itemsMap[itemName] = true
			datesMap[dateStr] = t.Date

			if dataMatrix[itemName] == nil {
				dataMatrix[itemName] = make(map[string]int)
			}
			dataMatrix[itemName][dateStr] += t.Quantity
		}

		sortedItems := make([]string, 0, len(itemsMap))
		for k := range itemsMap {
			sortedItems = append(sortedItems, k)
		}
		sort.Strings(sortedItems)

		sortedDates := make([]string, 0, len(datesMap))
		for k := range datesMap {
			sortedDates = append(sortedDates, k)
		}
		sort.Slice(sortedDates, func(i, j int) bool {
			return datesMap[sortedDates[i]].Before(datesMap[sortedDates[j]])
		})

		// Table Header
		headerRow := 5
		f.SetCellValue(sheetName, "A5", "Item")
		f.SetColWidth(sheetName, "A", "A", 30)

		for j, date := range sortedDates {
			cell, _ := excelize.CoordinatesToCellName(j+2, headerRow)
			f.SetCellValue(sheetName, cell, date)
			colName, _ := excelize.ColumnNumberToName(j + 2)
			f.SetColWidth(sheetName, colName, colName, 12)
		}

		lastCol, _ := excelize.ColumnNumberToName(len(sortedDates) + 1)
		f.SetCellStyle(sheetName, "A5", fmt.Sprintf("%s5", lastCol), tableHeaderStyle)

		// Table Body
		for rowIdx, item := range sortedItems {
			currentRow := headerRow + 1 + rowIdx
			f.SetCellValue(sheetName, fmt.Sprintf("A%d", currentRow), item)
			for colIdx, date := range sortedDates {
				cell, _ := excelize.CoordinatesToCellName(colIdx+2, currentRow)
				qty := dataMatrix[item][date]
				f.SetCellValue(sheetName, cell, qty)
			}
		}

		f.SetActiveSheet(index)
	}

	// Final Output
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=Batch_Summary_Report.xlsx")

	if err := f.Write(c.Writer); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate Excel file")
	}
}
