package routes

import (
	"github.com/Maheshkarri4444/Examify/controllers"
	"github.com/gin-gonic/gin"
)

func AuthRoutes(r *gin.Engine) {
	auth := r.Group("/auth")
	{
		auth.GET("/google", controllers.GoogleLogin)
		auth.GET("/googlecallback", controllers.GoogleCallback)
	}

}
