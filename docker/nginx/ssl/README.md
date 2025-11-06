# SSL Certificates Setup

This directory should contain your SSL certificates for HTTPS configuration.

## Required Files

Place your SSL certificate files in this directory:

- `cert.pem` - SSL certificate (public key)
- `key.pem` - SSL private key

## Option 1: Self-Signed Certificates (Development/Testing)

For development or testing purposes, you can generate self-signed certificates:

```bash
# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/key.pem \
  -out docker/nginx/ssl/cert.pem \
  -subj "/C=BR/ST=State/L=City/O=Organization/CN=localhost"
```

**Note**: Self-signed certificates will show a warning in browsers. Only use for development.

## Option 2: Let's Encrypt (Production)

For production, use Let's Encrypt to get free, valid SSL certificates:

### Step 1: Install Certbot

```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# On CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### Step 2: Obtain Certificates

```bash
# Replace yourdomain.com with your actual domain
sudo certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com \
  --email your-email@example.com \
  --agree-tos --no-eff-email
```

### Step 3: Copy Certificates

```bash
# Copy the generated certificates to this directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/nginx/ssl/key.pem
```

### Step 4: Set Up Auto-Renewal

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e
```

Add this line to renew certificates twice daily:

```
0 0,12 * * * certbot renew --quiet --post-hook "docker-compose -f /path/to/invest/docker-compose.yml restart nginx"
```

## Option 3: Commercial Certificate

If you purchased a certificate from a commercial CA:

1. Place the certificate in `cert.pem`
2. Place the private key in `key.pem`
3. If you have a certificate chain, combine it with your certificate:

```bash
cat your-certificate.crt intermediate.crt > docker/nginx/ssl/cert.pem
cp your-private-key.key docker/nginx/ssl/key.pem
```

## Security Best Practices

1. **Protect Private Keys**:
   ```bash
   chmod 600 docker/nginx/ssl/key.pem
   chmod 644 docker/nginx/ssl/cert.pem
   ```

2. **Never Commit Certificates**:
   - Certificates and keys are already in `.gitignore`
   - Never commit them to version control

3. **Use Strong Ciphers**:
   - The nginx.conf is already configured with strong ciphers
   - Only TLS 1.2 and 1.3 are enabled

4. **Test Your SSL Configuration**:
   - Use [SSL Labs](https://www.ssllabs.com/ssltest/) to test your configuration
   - Aim for an A+ rating

## Troubleshooting

### Certificate Not Found Error

If nginx fails to start with certificate errors:

```bash
# Check if files exist
ls -la docker/nginx/ssl/

# Check file permissions
ls -l docker/nginx/ssl/*.pem

# Check certificate validity
openssl x509 -in docker/nginx/ssl/cert.pem -text -noout
```

### Certificate Expired

```bash
# Check expiration date
openssl x509 -in docker/nginx/ssl/cert.pem -noout -enddate

# Renew Let's Encrypt certificate
sudo certbot renew
```

### Mixed Content Warnings

If you see mixed content warnings in the browser:

1. Ensure all API calls use HTTPS
2. Update `NEXT_PUBLIC_API_URL` to use `https://`
3. Check for hardcoded `http://` URLs in your code

## Docker Compose Integration

The certificates are mounted in `docker-compose.yml`:

```yaml
nginx:
  volumes:
    - ./docker/nginx/ssl:/etc/nginx/ssl:ro
```

The `:ro` flag means read-only for security.

## Testing

After setting up certificates:

```bash
# Start nginx
docker-compose --profile production up -d nginx

# Test HTTPS connection
curl -k https://localhost

# Check certificate details
echo | openssl s_client -connect localhost:443 -servername localhost 2>/dev/null | openssl x509 -noout -dates
```

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)
