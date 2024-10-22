export default function page() {
  return (
    <div className="flex p-5 flex-col justify-center items-center w-full flex-1">
      <h1 className="text-7xl pb-12 font-family-pixelpro">Refund Policy</h1>
      <div className="shadow-sm mx-14 md:min-w-0 md:max-w-2xl w-full bg-[#fbeed2] p-4 md:p-6 relative rounded-md">
        <h2 className="text-4xl font-family-pixelpro font-medium md:block">
          Refund Policy for Polomaps
        </h2>
        <p className="text-lg mt-1">Last Updated: August 2024</p>

        <p className="text-lg mt-4">
          At Polomaps, we strive to ensure that our users are satisfied with our
          services. This Refund Policy outlines the terms and conditions under
          which refunds may be issued for our annual subscriptions.
        </p>

        <h3 className="text-2xl font-semibold mt-5 font-family-pixelpro">
          1. Annual Subscriptions
        </h3>
        <p className="text-lg">
          All subscriptions to Polomaps are billed annually, covering a period
          of 365 days from the date of payment.
        </p>

        <h3 className="text-2xl font-semibold mt-5 font-family-pixelpro">
          2. Full Refund Eligibility
        </h3>
        <p className="text-lg">
          You are eligible for a full refund if you meet the following
          conditions:
        </p>
        <ul className="list-disc list-inside">
          <li className="text-lg">
            You request the refund within the first 7 days (one week) after your
            first payment.
          </li>
          <li className="text-lg">
            You send an email to tycho@polomaps.com with the following
            information:
            <ul className="list-disc list-inside ml-6">
              <li>Your order number.</li>
              <li>The email address you used to sign up for the service.</li>
            </ul>
          </li>
        </ul>
        <p className="text-lg">
          If you meet these conditions, you will receive a full refund of your
          payment.
        </p>

        <h3 className="text-2xl font-semibold mt-5 font-family-pixelpro">
          3. Refund Requests After the First Week
        </h3>
        <p className="text-lg">
          Refund requests made after the first 7 days are at the sole discretion
          of Polomaps. While we will consider all refund requests, we reserve
          the right to decline any requests made after the initial 7-day period.
          No rights to a refund are reserved after this period.
        </p>

        <h3 className="text-2xl font-semibold mt-5 font-family-pixelpro">
          4. How to Request a Refund
        </h3>
        <p className="text-lg">
          To request a refund, please follow these steps:
        </p>
        <ul className="list-disc list-inside">
          <li className="text-lg">
            Send an email to tycho@polomaps.com within the applicable timeframe.
          </li>
          <li className="text-lg">
            Include your order number and the email address used during signup.
          </li>
        </ul>

        <h3 className="text-2xl font-semibold mt-5 font-family-pixelpro">
          5. Processing Refunds
        </h3>
        <p className="text-lg">
          If your refund request is approved, the refund will be processed
          within 7-10 business days. The refunded amount will be credited back
          to the original payment method used for the subscription.
        </p>

        <h3 className="text-2xl font-semibold mt-5 font-family-pixelpro">
          6. Non-Refundable Services
        </h3>
        <p className="text-lg">
          Certain services and features offered by Polomaps may be
          non-refundable, as indicated at the time of purchase.
        </p>

        <h3 className="text-2xl font-semibold mt-5 font-family-pixelpro">
          7. Changes to This Policy
        </h3>
        <p className="text-lg">
          Polomaps reserves the right to modify this Refund Policy at any time.
          Any changes will be posted on this page. It is your responsibility to
          review this policy periodically to stay informed about any updates.
        </p>

        <h3 className="text-2xl font-semibold mt-5 font-family-pixelpro">
          8. Contact Us
        </h3>
        <p className="text-lg">
          For any questions regarding this Refund Policy, please contact us at
          tycho@polomaps.com.
        </p>
      </div>
    </div>
  )
}
