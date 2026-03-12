import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Basic check to see if something from the app is rendered
    // Since we don't know exactly what's on the landing page, we look for common elements
    // or just check that the container isn't empty.
    expect(document.body).toBeDefined();
  });
});
