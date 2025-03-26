import Image from "next/image";
import { useState } from "react";


const EventSteps = () => {
  const [selectedStep, setSelectedStep] = useState(1);

  const stepImages: Record<number, string> = {
    1: "/assets/images/toolclips.png",
    2: "/assets/images/engage.png",
    3: "/assets/images/manage.png",
  };


    return (
      <div className="mb-16 px-4 py-8 md:mx-auto md:px-24">
        <h2 className="mx-auto w-full text-center font-montserrat text-xl font-semibold leading-7 text-[#001433] md:w-[660px] md:text-[32px] md:leading-[40px]">
          From Idea to Sold-Out Even, Fast! Create & Manage Events in 3 Easy Steps
        </h2>
  
        <div className="mt-12 flex flex-col items-center gap-16 px-2 md:flex-row md:px-0">
          <div className="relative h-[340px] w-[343px]  overflow-hidden rounded-lg md:h-[500px] md:w-[490px]">
            <Image 
            src={stepImages[selectedStep]} 
            alt="step image"
            fill
            className="object-cover transition-transform duration-300"
          />
          </div>

          <div className="w-full md:w-[465px]">
              <div className="mb-12 flex flex-col">
              {[
              { step: 1, title: "1. Enter Event Details", description: "Add key info and select ticket types in minutes." },
              { step: 2, title: "2. Engage Your Audience", description: "Automate invitations, RSVPs and reminders to keep attendees informed." },
              { step: 3, title: "3. Sell & Manage Effortlessly", description: "Monitor real-time analytics to optimise attendance, engagement and overall event success." }
            ].map(({ step, title, description }) => (
              <div
                key={step}
                onClick={() => setSelectedStep(step)}
                className={`flex cursor-pointer flex-col gap-2 px-5 py-4 transition-all md:gap-4 md:py-6 ${
                  selectedStep === step ? "border-l-4 border-[#FFD700] bg-[#FFD7000D]" : ""
                }`}
              >
                <div className="font-inter text-base font-semibold text-[#1F2938] md:text-xl">{title}</div>
                <p className="font-inter text-sm font-normal text-[#6B7380] md:text-lg">{description}</p>
              </div>
            ))}
              </div>

              <button className="rounded-md bg-[#FFD700] p-4 text-center font-inter text-sm font-semibold text-[#001433] md:px-6 md:text-base">
                Try REVLR Now
              </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default EventSteps;
  