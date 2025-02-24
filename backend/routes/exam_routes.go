package routes

import (
	"github.com/Maheshkarri4444/Examify/controllers"
	"github.com/Maheshkarri4444/Examify/middleware"
	"github.com/gin-gonic/gin"
)

func ExamRoutes(r *gin.Engine) {
	exam := r.Group("/exam")
	{
		exam.POST("/create-exam", middleware.TeacherMiddleware(), controllers.CreateExam)
		exam.PUT("/update-exam", middleware.TeacherMiddleware(), controllers.UpdateExam)
		exam.POST("/exam/create-sets", controllers.CreateSetsForExam)
		exam.GET("/qpaper/:id", controllers.GetQuestionPaperByID)
		exam.GET("/getallexams", controllers.GetAllExams)
		exam.GET("/getexambyid", middleware.TeacherMiddleware(), controllers.GetExamById)
		exam.GET("/getexamsbycontainer", middleware.TeacherMiddleware(), controllers.GetExamsByTeacherContainer)

	}

}
