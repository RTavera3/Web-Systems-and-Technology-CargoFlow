import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

function setup() {
  return {
    user: userEvent.setup(),
    ...render(<App />),
  };
}

const pickup = () => screen.getByLabelText('Pickup location');
const dropoff = () => screen.getByLabelText('Drop-off location');
const findMatches = () => screen.getByRole('button', { name: /find matches/i });

describe('search UI', () => {
  it('shows matching routes after submitting a lane', async () => {
    const { user } = setup();

    await user.selectOptions(pickup(), 'Manila');
    await user.selectOptions(dropoff(), 'Batangas');
    await user.click(findMatches());

    expect(
      screen.getByRole('heading', { name: /1 matching route/i }),
    ).toBeInTheDocument();
    const results = screen.getByLabelText(/1 matching route/i);
    expect(
      within(results).getByText('Southbound Logistics'),
    ).toBeInTheDocument();
  });

  it('swaps pickup and drop-off locations', async () => {
    const { user } = setup();

    await user.selectOptions(pickup(), 'Manila');
    await user.selectOptions(dropoff(), 'Batangas');
    await user.click(
      screen.getByRole('button', { name: /swap pickup and destination/i }),
    );

    expect(pickup()).toHaveValue('Batangas');
    expect(dropoff()).toHaveValue('Manila');
  });

  it('runs a search when a popular route is chosen', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /Cebu.*Davao/ }));

    expect(pickup()).toHaveValue('Cebu');
    expect(dropoff()).toHaveValue('Davao');
    expect(
      screen.getByRole('heading', { name: /1 matching route/i }),
    ).toBeInTheDocument();
  });

  it('shows an empty state when no routes match', async () => {
    const { user } = setup();

    await user.selectOptions(pickup(), 'Baguio');
    await user.selectOptions(dropoff(), 'Davao');
    await user.click(findMatches());

    expect(
      screen.getByRole('heading', { name: /no shared routes found/i }),
    ).toBeInTheDocument();
  });

  it('rejects a search with the same pickup and drop-off', async () => {
    const { user } = setup();

    await user.selectOptions(pickup(), 'Manila');
    await user.selectOptions(dropoff(), 'Manila');
    await user.click(findMatches());

    expect(screen.getByRole('alert')).toHaveTextContent(
      /choose a destination different from your pickup location/i,
    );
    expect(
      screen.queryByRole('heading', { name: /matching route/i }),
    ).not.toBeInTheDocument();
  });
});
