# 🎬 Media Processing System


![mediaprocessor Demo](https://resi.io/wp-content/uploads/2022/05/what-is-a-video-compressor-resi.jpeg)



# Overview
This project is a scalable, serverless media processing system built with Django, React, and AWS Lambda for efficient image and video compression.it provides a complete solution for uploading, processing, and downloading media files with automatic compression. The system uses a serverless architecture with AWS Lambda for processing, making it highly scalable and cost-effective.

# Features
📂 Direct Uploads: Secure presigned URLs for direct S3 uploads

🗜️ Automatic Compression: Intelligent image and video compression

⚡ Scalable Architecture: Serverless design using AWS Lambda

📊 Real-time Status: Track processing status from upload to completion

💻 Responsive UI: React-based frontend for seamless user experience

🏗️ Infrastructure as Code: Terraform and CloudFormation for easy deployment

# ARCHITECTURE
![architecture Demo](lamdaCompress.jpeg)

# PROJECT STRUCTURE
    media-processing-system/  
    ├── backend/           
    │   ├── media_processing/   
    │   │   ├── models.py  
    │   │   ├── serializers.py   
    │   │   ├── views.py   
    │   │   ├── tasks.py   
    │   │   └── utils.py  
    │   ├── config/  
    │   │   ├── settings.py  
    │   │   └── urls.py  
    │   └── manage.py  
    ├── lambda-functions/           
    │   ├── image-compressor/  
    │   │   ├── app.py  
    │   │   ├── requirements.txt  
    │   │   └── Dockerfile  
    │   ├── video-compressor/  
    │   │   ├── app.py  
    │   │   ├── requirements.txt  
    │   │   └── Dockerfile  
    │   └── shared/       
    │       └── s3_utils.py  
    ├── infrastructure/       
    │   ├── terraform/  
    │   │   ├── main.tf   
    │   │   ├── variables.tf   
    │   │   └── outputs.tf  
    │   └── cloudformation/   
    │       └── media-processing-stack.yaml   
    ├── frontend/         
    │   ├── src/  
    │   │   ├── components/   
    │   │   │   └── MediaUploader.js     
    │   │   └── services/    
    │   │       └── api.js  
    │   └── package.json  
    └── README.md

# Quick Start
## Prerequisites

    Python 3.8+

    Node.js 14+

    AWS Account

    Terraform 1.0+ (optional)

    Docker (for Lambda deployment)

# Installation
## 1. Clone the repository
    git clone https://github.com/your-username/media-processing-system.git
    cd media-processing-system

