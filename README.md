# QRIS API

This project is a QRIS (Quick Response Code Indonesian Standard) converter API built using Elysia.js. It provides endpoints for converting static QRIS data into dynamic QRIS strings.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Installation

1. Clone the repository:
   ```bash
   git clone github.com/idlanyor/qris-converter
   cd qris-api
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Usage

To use the QRIS API, send a POST request to the `/convert` endpoint with the required data in the request body.

### Example Request

```json
{
  "qris": "00020101021126570011ID.DANA.WWW011893600915302259148102090225914810303UMI51440014ID.CO.QRIS.WWW0215ID10200176114730303UMI5204581253033605802ID5922Warung Sayur Bu Sugeng6010Kab. Demak610559567630458C7",
  "nominal": "10000",
  "biayaLayanan": {
    "type": "r",
    "value": "5000"
  }
}
```

### Example Response

```json
{
  "result": "converted_qris_string_here"
}
```

## API Endpoints

- `POST /convert`: Converts static QRIS data to dynamic QRIS string.

## License

This project is licensed under the MIT License.