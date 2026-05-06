import { View } from 'react-native';
import { Screen, Text, Card, Button, Chip, IconButton } from '@/components';
import { useTheme } from '@/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ marginBottom: spacing(8) }}>
      <Text variant="eyebrow" style={{ marginBottom: spacing(3) }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), alignItems: 'center' }}>
      {children}
    </View>
  );
}

export default function DesignShowcase() {
  const { spacing } = useTheme();
  return (
    <Screen scroll>
      <View style={{ gap: spacing(2), paddingTop: spacing(4) }}>
        {/* TYPOGRAPHY */}
        <Section title="TYPOGRAPHY">
          <Text variant="display">Display</Text>
          <Text variant="title">Title</Text>
          <Text variant="body">Body</Text>
          <Text variant="eyebrow">Eyebrow</Text>
          <Text variant="handwritten">Handwritten</Text>
          <Text variant="body" color="inkMuted">
            Body muted
          </Text>
        </Section>

        {/* CARDS */}
        <Section title="CARDS">
          <Card accent="surface" size="md">
            <Text variant="title">Surface</Text>
            <Text variant="body" color="inkMuted">
              Default card
            </Text>
          </Card>
          <View style={{ height: spacing(2) }} />
          <Card accent="sage" size="md">
            <Text variant="title">Sage</Text>
            <Text variant="body" color="inkMuted">
              Sage accent
            </Text>
          </Card>
          <View style={{ height: spacing(2) }} />
          <Card accent="lavender" size="md">
            <Text variant="title">Lavender</Text>
            <Text variant="body" color="inkMuted">
              Lavender accent
            </Text>
          </Card>
          <View style={{ height: spacing(2) }} />
          <Card accent="peach" size="md">
            <Text variant="title">Peach</Text>
            <Text variant="body" color="inkMuted">
              Peach accent
            </Text>
          </Card>
          <View style={{ height: spacing(2) }} />
          <Card accent="cream" size="md">
            <Text variant="title">Cream</Text>
            <Text variant="body" color="inkMuted">
              Cream accent
            </Text>
          </Card>
          <View style={{ height: spacing(2) }} />
          <Card bordered size="md">
            <Text variant="title">Bordered</Text>
            <Text variant="body" color="inkMuted">
              Bordered card
            </Text>
          </Card>
        </Section>

        {/* BUTTONS */}
        <Section title="BUTTONS">
          <Row>
            <Button label="Primary" variant="primary" size="sm" />
            <Button label="Primary" variant="primary" size="md" />
            <Button label="Primary" variant="primary" size="lg" />
          </Row>
          <View style={{ height: spacing(1) }} />
          <Row>
            <Button label="Ghost" variant="ghost" size="sm" />
            <Button label="Ghost" variant="ghost" size="md" />
            <Button label="Ghost" variant="ghost" size="lg" />
          </Row>
          <View style={{ height: spacing(1) }} />
          <Row>
            <Button label="Sage" variant="accent" accent="sage" size="sm" />
            <Button label="Lavender" variant="accent" accent="lavender" size="md" />
            <Button label="Peach" variant="accent" accent="peach" size="lg" />
          </Row>
          <View style={{ height: spacing(1) }} />
          <Row>
            <Button label="Loading" variant="primary" size="md" loading />
            <Button label="Full Width" variant="primary" size="md" fullWidth />
          </Row>
        </Section>

        {/* CHIPS */}
        <Section title="CHIPS">
          <Row>
            <Chip variant="filter" label="All" selected />
            <Chip variant="filter" label="Unselected" />
          </Row>
          <View style={{ height: spacing(1) }} />
          <Row>
            <Chip variant="tag" accent="sage" label="Sage" />
            <Chip variant="tag" accent="lavender" label="Lavender" />
            <Chip variant="tag" accent="peach" label="Peach" />
            <Chip variant="tag" accent="cream" label="Cream" />
          </Row>
        </Section>

        {/* ICON BUTTONS */}
        <Section title="ICON BUTTONS">
          <Row>
            <IconButton variant="plain" size="sm" accessibilityLabel="plain sm">
              <Text>•</Text>
            </IconButton>
            <IconButton variant="plain" size="md" accessibilityLabel="plain md">
              <Text>•</Text>
            </IconButton>
            <IconButton variant="plain" size="lg" accessibilityLabel="plain lg">
              <Text>•</Text>
            </IconButton>
          </Row>
          <View style={{ height: spacing(1) }} />
          <Row>
            <IconButton variant="filled" size="sm" accessibilityLabel="filled sm">
              <Text>•</Text>
            </IconButton>
            <IconButton variant="filled" size="md" accessibilityLabel="filled md">
              <Text>•</Text>
            </IconButton>
            <IconButton variant="filled" size="lg" accessibilityLabel="filled lg">
              <Text>•</Text>
            </IconButton>
          </Row>
          <View style={{ height: spacing(1) }} />
          <Row>
            <IconButton variant="accent" accent="sage" size="sm" accessibilityLabel="sage sm">
              <Text>•</Text>
            </IconButton>
            <IconButton variant="accent" accent="lavender" size="md" accessibilityLabel="lavender md">
              <Text>•</Text>
            </IconButton>
            <IconButton variant="accent" accent="peach" size="lg" accessibilityLabel="peach lg">
              <Text>•</Text>
            </IconButton>
          </Row>
        </Section>
      </View>
    </Screen>
  );
}
