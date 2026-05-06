import { render, screen } from '@testing-library/react-native';
import { AppProviders } from '@/providers/AppProviders';
import DesignShowcase from '../../app/design';

describe('Design showcase route', () => {
  it('renders all sections through providers without error', () => {
    expect(() =>
      render(
        <AppProviders>
          <DesignShowcase />
        </AppProviders>,
      ),
    ).not.toThrow();

    expect(screen.getByText('TYPOGRAPHY')).toBeTruthy();
  });
});
