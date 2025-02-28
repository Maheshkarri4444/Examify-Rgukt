package routes

import (
	"github.com/Maheshkarri4444/Examify/controllers"
	"github.com/gin-gonic/gin"
)

func AiRoutes(r *gin.Engine) {
	auth := r.Group("/ai")
	{
		auth.POST("/generate", controllers.GetChatResponse)
	}

}
