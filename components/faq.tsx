import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faq = [
  {
    question: "Is it actually free?",
    answer:
      "Yes, our service is completely free to use with no hidden charges or fees.",
  },
  {
    question: "Is there a limit to how much I can use it?",
    answer:
      "While we strive to provide unlimited access, there may be fair usage policies in place to ensure optimal performance for all users.",
  },
  {
    question: "Are the image generations free?",
    answer:
      "Yes, all image generations are free of charge. Enjoy creating as many images as you like!",
  },
  {
    question: "Will there be ads?",
    answer:
      "No. We hate ads as much as you do. Our platform is ad-free to ensure a seamless user experience.",
  },
  {
    question: "Will development be continued?",
    answer:
      "Yes, we are committed to ongoing development and improvements to enhance your experience. For any delays, you will be informed in advance.",
  },
];

const FAQ = () => {
  return (
    <div className="flex items-center justify-center my-24 px-6 py-12" id="faq">
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-center items-center items-start gap-x-12 gap-y-6">
      <div className="shrink-0">
        <h2 className="text-4xl lg:text-5xl leading-[1.15]! font-semibold tracking-[-0.035em]">
        Frequently Asked <br /> Questions
        </h2>
      </div>

      <Accordion type="single" defaultValue="question-0" className="max-w-xl flex-1">
        {faq.map(({ question, answer }, index) => (
        <AccordionItem key={question} value={`question-${index}`}>
          <AccordionTrigger className="text-left text-lg">
          {question}
          </AccordionTrigger>
          <AccordionContent className="text-base text-muted-foreground">
          {answer}
          </AccordionContent>
        </AccordionItem>
        ))}
      </Accordion>
      </div>
    </div>
  );
};

export default FAQ;
