{
  "type": "object",
  "properties": {
    "driver_name": {
      "type": "string",
      "description": "The name of the driver making the delivery."
    },
    "restaurants": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of restaurant names the driver delivered to."
    },
    "cylinders": {
      "type": "integer",
      "description": "The total number of cylinders dropped."
    },
    "confidence_flags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List any fields (e.g., 'restaurants', 'cylinders') where the transcript was ambiguous, incomplete, or highly likely to be a misinterpretation. Leave empty if highly confident."
    }
  },
  "required": ["driver_name", "restaurants", "cylinders", "confidence_flags"]
}
