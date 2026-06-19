import { useState } from "react";
import { Coffee, Heart, Sparkles, Crown } from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Field,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Avatar,
  Badge,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
  useToast,
} from "~/components/ui";

export function meta() {
  return [{ title: "bayluv · style guide" }];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

export default function StyleGuide() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <main className="mx-auto max-w-4xl space-y-12 px-6 py-16">
      <header className="space-y-2">
        <Badge tone="primary">
          <Sparkles className="h-3 w-3" /> design system
        </Badge>
        <h1 className="text-5xl font-extrabold text-ink">bayluv style guide</h1>
        <p className="text-lg text-ink-soft">
          Playful &amp; warm — the building blocks for the whole app.
        </p>
      </header>

      <Section title="Buttons">
        <Button>
          <Coffee className="h-5 w-5" /> Buy a coffee
        </Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="soft">Soft</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title="Badges">
        <Badge tone="primary">Primary</Badge>
        <Badge tone="mint">Mint</Badge>
        <Badge tone="sky">Sky</Badge>
        <Badge tone="grape">Grape</Badge>
        <Badge tone="sunny">Sunny</Badge>
        <Badge tone="success">Active</Badge>
        <Badge tone="neutral">Neutral</Badge>
      </Section>

      <Section title="Avatars">
        <Avatar name="Peter Webby" size="sm" />
        <Avatar name="Cara Art" size="md" />
        <Avatar name="Juliet" size="lg" />
        <Avatar
          src="https://i.pravatar.cc/120?img=12"
          name="With image"
          size="lg"
        />
      </Section>

      <Section title="Goal progress">
        <div className="w-full max-w-md space-y-2">
          <Progress value={89} />
          <p className="text-sm font-semibold text-ink-soft">
            89% of monthly goal
          </p>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="w-full max-w-md space-y-4">
          <Field label="Display name" hint="Shown on your page">
            <Input placeholder="Peter Webby" />
          </Field>
          <Field label="Bio" error="Bio is required">
            <Textarea placeholder="Tell supporters about yourself…" />
          </Field>
        </div>
      </Section>

      <Section title="Cards">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-sunny" /> Shub LEGEND
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-extrabold text-ink">
              £25 <span className="text-base font-medium text-muted">/ month</span>
            </p>
            <p className="text-ink-soft">
              Top status, a personalised message in the mail, and discord perks.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <Heart className="h-5 w-5" /> Join
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="about" className="w-full">
          <TabsList>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="shop">Shop</TabsTrigger>
          </TabsList>
          <TabsContent value="about" className="pt-4 text-ink-soft">
            About panel content.
          </TabsContent>
          <TabsContent value="membership" className="pt-4 text-ink-soft">
            Membership panel content.
          </TabsContent>
          <TabsContent value="shop" className="pt-4 text-ink-soft">
            Shop panel content.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Overlays & feedback">
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Button
          variant="outline"
          onClick={() =>
            toast({
              tone: "success",
              title: "Thanks for the coffee!",
              description: "Your support means the world.",
            })
          }
        >
          Show toast
        </Button>
        <DropdownMenu trigger={<Button variant="soft">Menu ▾</Button>}>
          <DropdownItem>Edit page</DropdownItem>
          <DropdownItem>Share</DropdownItem>
          <DropdownSeparator />
          <DropdownItem className="text-danger hover:text-danger">
            Sign out
          </DropdownItem>
        </DropdownMenu>
      </Section>

      <Dialog open={open} onOpenChange={setOpen} title="Buy Peter a coffee">
        <div className="space-y-4">
          <Field label="Your name">
            <Input placeholder="@yourhandle" />
          </Field>
          <Field label="Say something nice">
            <Textarea placeholder="Love your content!" />
          </Field>
          <Button
            className="w-full"
            onClick={() => {
              setOpen(false);
              toast({ tone: "success", title: "Support sent 🎉" });
            }}
          >
            Support $5
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
