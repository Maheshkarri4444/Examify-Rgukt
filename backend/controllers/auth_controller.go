package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Maheshkarri4444/Examify/config"
	"github.com/Maheshkarri4444/Examify/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var userCollection *mongo.Collection = config.GetCollection(config.Client, "users")

var googleOauthConfig = &oauth2.Config{
	ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
	ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
	RedirectURL:  "http://localhost:5173/google/callback",
	Scopes:       []string{"email", "profile"},
	Endpoint:     google.Endpoint,
}

func generateJWT(email string) (string, error) {
	claims := jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func GoogleLogin(c *gin.Context) {
	url := googleOauthConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	c.Redirect(http.StatusFound, url)
}

func GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing authorization code"})
	}

	token, err := googleOauthConfig.Exchange(context.TODO(), code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange code", "details": err.Error()})
		return
	}

	userInfoResp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user info", "details": err.Error()})
		return
	}
	defer userInfoResp.Body.Close()

	var userInfo map[string]interface{}
	if err := json.NewDecoder(userInfoResp.Body).Decode(&userInfo); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode user info", "details": err.Error()})
		return
	}

	email, ok := userInfo["email"].(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Email not found in user info"})
		return
	}
	name, _ := userInfo["name"].(string)
	googleID, _ := userInfo["id"].(string)
	image, _ := userInfo["picture"].(string) //url of image

	role := "teaher"
	if strings.HasSuffix(email, "@rguktn.ac.in") {
		role = "student"
	}

	var user models.User
	err = userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)

	if err == mongo.ErrNoDocuments {
		user = models.User{
			ID:        primitive.NewObjectID(),
			Name:      name,
			Email:     email,
			GoogleID:  googleID,
			Image:     image,
			Role:      role,
			CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
			UpdatedAt: primitive.NewDateTimeFromTime(time.Now()),
		}
		_, err := userCollection.InsertOne(context.TODO(), user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user", "details": err.Error()})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error", "details": err.Error()})
		return
	} else {
		updateFields := bson.M{
			"$set": bson.M{
				"role":       role,
				"image":      image,
				"updated_at": primitive.NewDateTimeFromTime(time.Now()),
			},
		}
		_, err := userCollection.UpdateOne(context.TODO(), bson.M{"email": email}, updateFields)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user", "details": err.Error()})
			return
		}

		err = userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated user", "details": err.Error()})
			return
		}
	}

	jwtToken, err := generateJWT(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate JWT", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": jwtToken, "user": user})
}
