## Requirements:

1. node 20
2. openssl (`brew install openssl`)

### Certs setup

1. Change the curl command to allow self-signed certs with `-k`.
2. Generate a CSR using the provided private key `openssl req -new -key private_key.pem -out certificate.csr`
3. Create a self-signed certificate using the CSR and private key
   `openssl x509 -req -in certificate.csr -signkey private_key.pem -out certificate.pem -days 365`

### Getting started

Run `yarn`

### Thoughts 
