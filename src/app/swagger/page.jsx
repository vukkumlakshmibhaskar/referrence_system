'use client';

import { useEffect } from 'react';

export default function SwaggerPage() {
  useEffect(() => {
    // Redirect to static Swagger HTML
    window.location.href = '/swagger.html';
  }, []);

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Roboto, sans-serif' }}>
      <h1>API Documentation</h1>
      <p>Redirecting to Swagger UI...</p>
      <p>
        <a href="/swagger.html">Click here if redirect doesn't work</a>
      </p>
    </div>
  );
}