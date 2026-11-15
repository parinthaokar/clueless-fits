import { Button, Card, Logo, Pill, PlaidBand } from "@/components/ui";
import GarmentStrip from "@/components/GarmentStrip";

const steps = [
  { title: "Snap your clothes", body: "Photograph a piece, or upload a picture you already have." },
  {
    title: "We tag it from the photo",
    body: "Category, color and pattern fill in automatically. You can fix anything.",
  },
  { title: "Ask for an outfit", body: "Pick an occasion and get a look built only from pieces you own." },
];

export default function Home() {
  return (
    <>
      <PlaidBand>
        <div className="mx-auto max-w-[1200px]">
          <header className="flex items-center">
            <Logo />
            <div className="flex-1" />
            {/* No auth yet: the demo closet stands in for a signed-in account. */}
            <Pill href="/wardrobe" className="mr-2.5">
              Sign in
            </Pill>
          </header>

          <div className="mt-[46px] max-w-[760px]">
            <Logo variant="headline" as="h1">
              What should I
              <br />
              wear today?
            </Logo>
            <div>
              <p className="mt-[22px] inline-block rounded-full bg-ink px-4 py-2 text-base font-bold text-mustard">
                Your closet, organized. Outfits from what you already own.
              </p>
            </div>
            <div className="mt-[26px] flex flex-wrap gap-3.5">
              <Button href="/wardrobe">Start my closet</Button>
              <Button href="/wardrobe" variant="secondary">
                Try the demo closet
              </Button>
            </div>
          </div>
        </div>
      </PlaidBand>

      <main className="mx-auto max-w-[1280px]">
        <section aria-labelledby="how-it-works" className="px-5 pt-9 pb-2.5 sm:px-10">
          <h2 id="how-it-works" className="sr-only">
            How it works
          </h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <Card key={step.title} as="li" className="px-[22px] pt-[22px] pb-6">
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-raspberry text-xl font-extrabold text-white"
                >
                  {i + 1}
                </span>
                <h3 className="mt-3.5 mb-1.5 text-xl font-extrabold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="text-[15px] leading-[1.45] text-muted">{step.body}</p>
              </Card>
            ))}
          </ol>
        </section>

        <section aria-label="Example pieces" className="px-5 pt-[26px] pb-10 sm:px-10">
          <GarmentStrip />
          <p className="mt-[22px] text-center text-[13px] text-muted">
            Tagging model trained on 200,806 catalog items across 11 categories · built for a UNC Charlotte
            data science project
          </p>
        </section>
      </main>
    </>
  );
}
