# Stage 1: Build the React frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend

# Copy package config
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Build the frontend (Vite)
COPY frontend/ ./
RUN npm run build


# Stage 2: Serve with FastAPI
FROM python:3.12-slim AS serve-backend
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ /app/backend/

# Copy the built React app from the frontend stage
COPY --from=build-frontend /app/frontend/dist /app/backend/frontend/dist

# Expose port 8000
EXPOSE 8000

# Set working directory to backend so relative DB paths and imports work cleanly
WORKDIR /app/backend

# Run the unified app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
