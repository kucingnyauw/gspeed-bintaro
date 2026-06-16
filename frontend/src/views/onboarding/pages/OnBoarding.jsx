import OnboardingWrapper from "@views/onboarding/wrapper/OnBoardingWrapper.jsx";
import { OnboardingHeader, OnboardingContent, OnboardingFooter } from "@views/onboarding/components";

const Onboarding = () => {
  return (
    <>
      <OnboardingHeader />
      <OnboardingWrapper>
        <OnboardingContent />
      </OnboardingWrapper>
      <OnboardingFooter />
    </>
  );
};

export default Onboarding;