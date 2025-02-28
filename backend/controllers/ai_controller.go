package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

type ChatRequest struct {
	Prompt      string   `json:"prompt" binding:"required"`
	ChatHistory []string `json:"chatHistory"`
}

type ChatResponse struct {
	Response string `json:"response"`
}

func RunChat(prompt string, chatHistory []string) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("API key is missing")
	}

	// Use the correct model: gemini-2.0-flash
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=%s", apiKey)

	// Prepare JSON payload
	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"role":  "user",
				"parts": []map[string]string{{"text": prompt}},
			},
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to encode request body: %w", err)
	}

	// Make HTTP request
	req, err := http.NewRequestWithContext(context.Background(), "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	// Log the full API response for debugging
	// fmt.Println("API Response:", string(body))

	// Correct the response parsing
	var responseMap map[string]interface{}
	err = json.Unmarshal(body, &responseMap)
	if err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	// Check if 'candidates' exist in the response
	if candidates, ok := responseMap["candidates"].([]interface{}); ok && len(candidates) > 0 {
		if candidate, ok := candidates[0].(map[string]interface{}); ok {
			if content, ok := candidate["content"].(map[string]interface{}); ok {
				if parts, ok := content["parts"].([]interface{}); ok && len(parts) > 0 {
					if text, ok := parts[0].(map[string]interface{})["text"].(string); ok {
						return text, nil
					}
				}
			}
		}
	}

	return "No valid response from AI", nil
}

func GetChatResponse(c *gin.Context) {
	var request ChatRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Prompt is required"})
		return
	}

	responseText, err := RunChat(request.Prompt, request.ChatHistory)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	c.JSON(http.StatusOK, ChatResponse{Response: responseText})
}
