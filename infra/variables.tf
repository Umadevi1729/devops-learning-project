variable "aws_region" {
  description = "AWS region used for the S3 bucket."
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "Globally unique name for the private S3 bucket."
  type        = string
}
