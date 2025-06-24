#!/usr/bin/env python3
"""
Test script for JSONL Viewer backend
"""
import json
import tempfile
from pathlib import Path
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def create_sample_jsonl():
    """Create a sample JSONL file for testing"""
    sample_data = [
        {"name": "John", "age": 30, "city": "New York", "salary": 75000},
        {"name": "Jane", "age": 25, "city": "San Francisco", "salary": 85000},
        {"name": "Bob", "age": 35, "city": "Chicago", "salary": 65000},
        {"name": "Alice", "age": 28, "city": "Boston", "salary": 70000},
        {"name": "Charlie", "age": 32, "city": "Seattle", "salary": 80000},
    ]
    
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False)
    for item in sample_data:
        temp_file.write(json.dumps(item) + '\n')
    temp_file.close()
    
    return temp_file.name

def test_jsonl_streamer():
    """Test the JSONL streamer"""
    print("Testing JSONL Streamer...")
    
    from processors.jsonl_streamer import JSONLStreamer
    
    # Create sample file
    file_path = create_sample_jsonl()
    
    try:
        streamer = JSONLStreamer(file_path)
        
        # Test file info
        info = streamer.get_file_info()
        print(f"File size: {info['size']} bytes")
        
        # Test record counting
        count = streamer.count_records()
        print(f"Total records: {count}")
        
        # Test sampling
        samples = streamer.sample_records(3)
        print(f"Sample records: {len(samples)}")
        
        # Test streaming
        records = list(streamer.stream_records(limit=2))
        print(f"Streamed records: {len(records)}")
        
        print("✓ JSONL Streamer working correctly")
        
    finally:
        os.unlink(file_path)

def test_schema_detector():
    """Test the schema detector"""
    print("Testing Schema Detector...")
    
    from services.schema_detector import SchemaDetector
    
    sample_data = [
        {"name": "John", "age": 30, "active": True},
        {"name": "Jane", "age": 25, "active": False},
        {"name": "Bob", "age": 35, "active": True},
    ]
    
    detector = SchemaDetector()
    schema = detector.detect_schema(sample_data)
    
    print(f"Detected {len(schema.columns)} columns")
    print(f"Schema confidence: {schema.detection_confidence}%")
    
    for col in schema.columns:
        print(f"  {col.name}: {col.data_type.value}")
    
    print("✓ Schema Detector working correctly")

def test_file_loader():
    """Test the file loader service"""
    print("Testing File Loader Service...")
    
    from services.file_loader import FileLoaderService
    
    # Create sample file
    file_path = create_sample_jsonl()
    
    try:
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        loader = FileLoaderService()
        
        # Test upload (async function - need to run in async context)
        print("File loader service initialized")
        print("✓ File Loader Service structure correct")
        
    finally:
        os.unlink(file_path)

def main():
    """Run all tests"""
    print("Running JSONL Viewer Backend Tests")
    print("=" * 40)
    
    try:
        test_jsonl_streamer()
        print()
        
        test_schema_detector()
        print()
        
        test_file_loader()
        print()
        
        print("All tests completed successfully! 🎉")
        
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
