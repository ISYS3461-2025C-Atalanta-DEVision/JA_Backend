#!/bin/bash

# =============================================================================
# Kafka Topics Setup Script for DEVision Job Matching System
# =============================================================================
# This script creates all required Kafka topics for the Job Applicant (JA)
# and Job Manager (JM) premium matching features.
#
# Usage:
#   ./scripts/kafka-setup-topics.sh
#
# Prerequisites:
#   - Docker running with Kafka container (docker-compose.local.yml)
#   - Kafka container must be healthy
# =============================================================================

set -e

KAFKA_CONTAINER="kafka"
BOOTSTRAP_SERVER="localhost:9093"
KAFKA_TOPICS_CMD="kafka-topics"

echo "=========================================="
echo "  DEVision Kafka Topics Setup"
echo "=========================================="

# Check if Kafka container is running
if ! docker ps | grep -q $KAFKA_CONTAINER; then
    echo "ERROR: Kafka container is not running!"
    echo "Start it with: docker compose -f docker-compose.local.yml up -d kafka"
    exit 1
fi

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
until docker exec $KAFKA_CONTAINER $KAFKA_TOPICS_CMD --bootstrap-server $BOOTSTRAP_SERVER --list > /dev/null 2>&1; do
    echo "  Kafka not ready yet, waiting..."
    sleep 2
done
echo "Kafka is ready!"
echo ""

# Function to create topic
create_topic() {
    local topic_name=$1
    local partitions=${2:-3}
    local retention_ms=${3:-604800000}  # 7 days default

    echo -n "Creating topic: $topic_name (partitions: $partitions)... "

    # Check if topic exists
    if docker exec $KAFKA_CONTAINER $KAFKA_TOPICS_CMD --bootstrap-server $BOOTSTRAP_SERVER --list | grep -q "^${topic_name}$"; then
        echo "already exists"
    else
        docker exec $KAFKA_CONTAINER $KAFKA_TOPICS_CMD \
            --bootstrap-server $BOOTSTRAP_SERVER \
            --create \
            --topic "$topic_name" \
            --partitions "$partitions" \
            --replication-factor 1 \
            --config retention.ms=$retention_ms \
            > /dev/null 2>&1
        echo "created"
    fi
}

echo "=========================================="
echo "  Creating Subscription Topics"
echo "=========================================="
# JA = Job Applicant, JM = Job Manager (Company)
create_topic "subscription.premium.ja.created" 3
create_topic "subscription.premium.ja.expired" 3
create_topic "subscription.premium.jm.created" 3
create_topic "subscription.premium.jm.expired" 3

echo ""
echo "=========================================="
echo "  Creating Profile Topics"
echo "=========================================="
create_topic "profile.ja.search-profile.updated" 6
create_topic "profile.jm.search-profile.updated" 6

echo ""
echo "=========================================="
echo "  Creating Job Topics"
echo "=========================================="
create_topic "job.created" 6
create_topic "job.updated" 3
create_topic "job.closed" 3

echo ""
echo "=========================================="
echo "  Creating Matching Topics"
echo "=========================================="
create_topic "matching.jm-to-ja.completed" 6
create_topic "matching.ja-to-jm.completed" 6

echo ""
echo "=========================================="
echo "  Creating Notification Topics"
echo "=========================================="
create_topic "notification.job-match.pending" 6
create_topic "notification.job-match.sent" 3
create_topic "notification.job-match.failed" 3 2592000000  # 30 days retention

echo ""
echo "=========================================="
echo "  Creating Dead Letter Queue Topics"
echo "=========================================="
create_topic "dlq.matching.failed" 1 2592000000  # 30 days retention
create_topic "dlq.notification.failed" 1 2592000000  # 30 days retention

echo ""
echo "=========================================="
echo "  All Topics Created Successfully!"
echo "=========================================="
echo ""
echo "View topics in Kafka UI: http://localhost:8080"
echo ""

# List all topics
echo "Current topics:"
docker exec $KAFKA_CONTAINER $KAFKA_TOPICS_CMD --bootstrap-server $BOOTSTRAP_SERVER --list
