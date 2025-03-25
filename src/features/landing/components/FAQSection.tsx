import { useState } from "react";

interface FAQSectionProps {
    isOrganizer: boolean;
}

const faqData = {
    attendee: [
      {
        id: 1,
        question: "How does the ticket resale feature work?",
        answer: "As an attendee, you can list your tickets for resale through your REVLR account. Once listed, they'll be available for other attendees to purchase. When sold, you'll receive payment automatically minus a small service fee."
      },
      {
        id: 2,
        question: "Can I get a refund instead?",
        answer: "Refund policies are set by event organizers. Check the specific event's refund policy in your ticket details. If refunds are available, you can request one from your Orders page. Otherwise, you may be able to resell your ticket."
      },
      {
        id: 3,
        question: "How do I track my ticket purchases?",
        answer: "All your ticket purchases can be tracked in your REVLR account under 'My Tickets'. You'll also receive email confirmations and updates about your upcoming events."
      },
      {
        id: 4,
        question: "What payment options do you support?",
        answer: "We accept all major credit cards, PayPal, Apple Pay, and Google Pay. Some events may offer additional payment options such as payment plans or cryptocurrency."
      },
      {
        id: 5,
        question: "How do I transfer tickets to friends?",
        answer: "You can transfer tickets to friends directly from your account. Go to 'My Tickets', select the ticket you want to transfer, and enter your friend's email address. They'll receive instructions to claim the ticket."
      }
    ],
    organizer: [
      {
        id: 1,
        question: "How does the ticket resale feature work for my events?",
        answer: "As an organizer, you can enable or disable ticket resales for your events. You can set resale rules including price caps and timeframes. REVLR handles all transactions securely, and you'll receive detailed reports on resale activity."
      },
      {
        id: 2,
        question: "Can I customize refund policies?",
        answer: "Yes, you have complete control over refund policies. Set custom rules based on time before the event, ticket type, or other criteria. You can also offer automatic refunds for specific scenarios."
      },
      {
        id: 3,
        question: "How do I track ticket sales and attendee engagement?",
        answer: "Your organizer dashboard provides real-time analytics on sales, revenue, and attendee demographics. You can track engagement through page views, email open rates, and social sharing. Export reports anytime for further analysis."
      },
      {
        id: 4,
        question: "What payment options do you support for organizers?",
        answer: "We support multiple payment methods for your attendees, and payouts to organizers are available via direct deposit, PayPal, or stripe. We offer flexible payout schedules including instant payouts (for a small fee) or standard payouts (typically 5-7 business days)."
      },
      {
        id: 5,
        question: "How do I manage event capacity and waitlists?",
        answer: "Set overall capacity or create ticket tiers with individual limits. When events sell out, you can enable waitlists that automatically notify potential attendees when tickets become available through cancellations or increased capacity."
      }
    ]
  };

const FAQSection = ({ isOrganizer} : FAQSectionProps) => {
    const [userType] = useState(isOrganizer ? 'organizer' : 'attendee');
    const [openItemId, setOpenItemId] = useState<number | null>(null);  

    const toggleItem = (id: number) => {
        setOpenItemId(openItemId === id ? null : id);
      };

    return (
        <section className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="mb-10 text-center font-montserrat text-2xl font-semibold">FAQs</h2>
    
          {/* FAQ accordion */}
          <div className="space-y-6">
            {faqData[userType].map(item => (
              <div key={item.id} className="overflow-hidden rounded-lg border border-[#F7F8FA]">
                <button
                  className="flex w-full items-center justify-between bg-[#F7F8FA] p-6 text-left"
                  onClick={() => toggleItem(item.id)}
                >
                  <span className="font-inter text-[16px] font-medium text-[#1F2938]">{item.question}</span>
                  <svg
                    className={`size-5 text-blue-500${openItemId === item.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {openItemId === item.id && (
                  <div className="border-gray-200 bg-[#F7F8FA] px-6 py-3 ">
                    <p className="font-inter text-[16px] font-normal text-[#4C5563]">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
    
          {/* Contact section */}
          <div className="mt-12 flex flex-col items-center justify-between rounded-lg bg-[#F1F6FF] p-6 md:flex-row">
            <div>
              <h3 className="font-inter text-xl font-semibold text-[#001433]">Still have questions?</h3>
              <p className="mt-1 font-inter text-[16px] font-normal text-[#4C5563]">Have a question we haven't answered? Get in touch with us and we'll reply ASAP.</p>
            </div>
            <a
              href="#email-us"
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-inter font-medium text-white transition-colors hover:bg-blue-700 md:mt-0"
            >
              Email Us
            </a>
          </div>
        </section>
      );
}

export default FAQSection