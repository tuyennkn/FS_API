# API Testing Guide for FS API

This directory contains HTTP request files for testing the FS API endpoints using VS Code REST Client extension.

## Files Overview

- `auth.http` - Authentication endpoints (login, register)
- `category.http` - Category management endpoints
- `book.http` - Book management endpoints  
- `comment.http` - Comment management endpoints

## Setup

1. Install the "REST Client" extension in VS Code
2. Update the token variables in each file with valid JWT tokens
3. Update the sample IDs with actual IDs from your database

## Usage

1. Open any `.http` file in VS Code
2. Click "Send Request" above any request block
3. View the response in the adjacent panel

## Variables

Each file uses variables for:
- `@baseUrl` - Base API URL
- `@adminToken` - Admin JWT token
- `@userToken` - User JWT token
- Sample IDs for testing

## Authentication

Most endpoints require authentication. Make sure to:
1. Login first to get valid tokens
2. Copy the tokens to the variable sections
3. Use appropriate tokens for different permission levels

## Permission Levels

- **Public**: No authentication required
- **User**: Requires user token
- **Admin**: Requires admin token

Check each endpoint's authorization header to see what level is required.
