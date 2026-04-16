#!/bin/bash
# api/deploy.sh
# Deployment script for Robohorse API

echo "Deploying Robohorse API..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

# Set variables
API_DIR="/var/www/games.smoxu.com/robohorse/api"
LOG_FILE="/var/log/robohorse_deploy.log"

# Create log file if it doesn't exist
touch $LOG_FILE
echo "$(date): Starting deployment" >> $LOG_FILE

# Create directory structure if it doesn't exist
echo "Creating directory structure..."
mkdir -p $API_DIR
echo "$(date): Created directory structure" >> $LOG_FILE

# Copy files to the deployment directory
echo "Copying files to deployment directory..."
cp -r ./* $API_DIR/
echo "$(date): Copied files to deployment directory" >> $LOG_FILE

# Set proper permissions
echo "Setting permissions..."
chown -R www-data:www-data $API_DIR
chmod -R 755 $API_DIR
echo "$(date): Set permissions" >> $LOG_FILE

# Install dependencies
echo "Installing dependencies..."
cd $API_DIR
npm install --production
echo "$(date): Installed dependencies" >> $LOG_FILE

# Restart Passenger
echo "Restarting Passenger..."
passenger-config restart-app $API_DIR
echo "$(date): Restarted Passenger" >> $LOG_FILE

# Check if Passenger is running
echo "Checking if Passenger is running..."
passenger-status | grep $API_DIR
if [ $? -eq 0 ]; then
  echo "Passenger is running successfully!"
  echo "$(date): Passenger is running successfully" >> $LOG_FILE
else
  echo "Passenger failed to start. Check logs at /var/log/nginx/error.log"
  echo "$(date): Passenger failed to start" >> $LOG_FILE
fi

echo "Deployment completed!"
echo "$(date): Deployment completed" >> $LOG_FILE 