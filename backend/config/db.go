package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client = createMongoClient()

func createMongoClient() *mongo.Client {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading the file: %v", err)
	}

	MongodbUri := os.Getenv("MONGODB_URI")
	if MongodbUri == "" {
		log.Fatal("Mongodburi is not found in the env variables")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(MongodbUri))
	if err != nil {
		log.Fatal("mongo db connection error: ", err)
	}

	fmt.Println("connected to mongodb")
	return client
}

func GetCollection(client *mongo.Client, collectionName string) *mongo.Collection {
	return client.Database(os.Getenv("DB_NAME")).Collection(collectionName)

}
