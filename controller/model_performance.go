package controller

import (
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// GetModelPerformance returns aggregated performance figures for a single
// model. It backs the "performance" tab on the pricing page.
func GetModelPerformance(c *gin.Context) {
	modelName := strings.TrimSpace(c.Query("model"))
	if modelName == "" {
		common.ApiErrorMsg(c, "model is required")
		return
	}
	windowHours := 24
	if raw := strings.TrimSpace(c.Query("hours")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			windowHours = parsed
		}
	}
	result, err := model.GetModelPerformance(modelName, windowHours)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}
