import { HelpCircle } from "lucide-react";

import { FAQ_SECTIONS } from "@/constants/faq";
import { withErrorBoundary, PageHeader } from "@/components/common";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function FAQPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="FAQ"
        description="Frequently asked questions about ClearPath"
      />

      <div className="space-y-4">
        {FAQ_SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <HelpCircle className="size-5 text-primary" />
                <CardTitle>{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Accordion type="multiple">
                {section.items.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`${section.title}-${index}`}
                  >
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default withErrorBoundary(FAQPage, "FAQ");
