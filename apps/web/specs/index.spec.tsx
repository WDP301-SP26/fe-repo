import { render } from '@testing-library/react';
import Page from '../src/app/page';

// Mocking child components as they might be Server Components
jest.mock('../src/components/sections/blog', () => () => (
  <div data-testid="blog-section" />
));
jest.mock('../src/components/sections/cta', () => () => (
  <div data-testid="cta-section" />
));
jest.mock('../src/components/sections/faq', () => () => (
  <div data-testid="faq-section" />
));
jest.mock('../src/components/sections/features', () => () => (
  <div data-testid="features-section" />
));
jest.mock('../src/components/sections/footer', () => () => (
  <div data-testid="footer-section" />
));
jest.mock('../src/components/sections/header', () => () => (
  <div data-testid="header-section" />
));
jest.mock('../src/components/sections/hero', () => () => (
  <div data-testid="hero-section" />
));
jest.mock('../src/components/sections/how-it-works', () => () => (
  <div data-testid="how-it-works-section" />
));
jest.mock('../src/components/sections/logos', () => () => (
  <div data-testid="logos-section" />
));
jest.mock('../src/components/sections/pricing', () => () => (
  <div data-testid="pricing-section" />
));
jest.mock('../src/components/sections/problem', () => () => (
  <div data-testid="problem-section" />
));
jest.mock('../src/components/sections/solution', () => () => (
  <div data-testid="solution-section" />
));
jest.mock('../src/components/sections/testimonials', () => () => (
  <div data-testid="testimonials-section" />
));
jest.mock('../src/components/sections/testimonials-carousel', () => () => (
  <div data-testid="testimonials-carousel-section" />
));

describe('Page', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Page />);
    expect(baseElement).toBeTruthy();
  });
});
