// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { AqiBadge } from '@/components/AqiBadge';
import { ForecastStrip } from '@/components/ForecastStrip';
import { ImpactExplainer } from '@/components/ImpactExplainer';
import { makeProfile, makeSnapshot } from '../fixtures';

async function scan(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      region: { enabled: false },
      // jsdom has no canvas; colour contrast is checked in the Playwright browser scans.
      'color-contrast': { enabled: false },
    },
  });
  return results.violations.map((violation) => `${violation.id}: ${violation.description}`);
}

describe('accessibility of data components', () => {
  afterEach(cleanup);

  it('AQI badge exposes text as well as colour', async () => {
    const { container, getByLabelText } = render(<AqiBadge aqi={165} />);
    expect(getByLabelText(/Air quality index 165, Unhealthy/)).toBeInTheDocument();
    expect(await scan(container)).toEqual([]);
  });

  it('forecast strip gives every bar a text value', async () => {
    const { container } = render(<ForecastStrip hours={makeSnapshot().hourly} />);
    expect(await scan(container)).toEqual([]);
  });

  it('impact explainer uses a labelled table and real values', async () => {
    const { container, getByText } = render(
      <ImpactExplainer snapshot={makeSnapshot()} profile={makeProfile()} />,
    );
    expect(getByText(/What one swap saves/)).toBeInTheDocument();
    expect(await scan(container)).toEqual([]);
  });
});
