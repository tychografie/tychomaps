import Link from "next/link"

/* eslint-disable @next/next/no-img-element */
export default function page() {
  return (
    <div className="flex p-5 flex-col justify-center items-center w-full flex-1">
      <h1 className="text-7xl pb-12 font-family-pixelpro">
        (re)discover your city
      </h1>
      <div className="shadow-sm mx-14 md:min-w-0 md:max-w-2xl w-full bg-[#fbeed2] p-4 md:p-6 relative rounded-md">
        <h1 className="text-4xl font-family-pixelpro font-medium md:block">
          How to find the best places?
        </h1>
        <p className="text-lg mt-1">
          Our unique platform combines Google Maps with advanced Artificial
          Intelligence to deliver not just any places, but the best ones
          according to locals. We avoid the commonplace and steer you toward the
          extraordinary, ensuring you mingle with locals away from the usual
          tourist spots.
        </p>
        <ul className="my-4 text-lg list-disc pl-10">
          <li>
            Use the pin icon (
            <img
              src="/img/location-on.svg"
              alt="Location"
              className="inline-block w-5 h-5"
            />
            ) to search locally within 1000 meters of your current location.
          </li>
        </ul>

        <em className="text-sm">
          *&apos;Best&apos; means places with high ratings and stellar reviews,
          with a bias towards local and independent spots.
        </em>

        <h2 className="text-3xl font-semibold mt-5 font-family-pixelpro">
          What can I find with this tool?
        </h2>
        <p className="text-lg">Beyond the usual, you&apos;ll uncover:</p>
        <ul className="list-disc pl-10 mt-2 text-lg">
          <li>Top-rated car repair shops</li>
          <li>Favorite local parks</li>
          <li>Highly recommended plumbers and dentists</li>
          <li>Outdoor trails & mountains</li>
          <li>And way more...</li>
        </ul>
        <h2 className="text-3xl font-semibold mt-5 font-family-pixelpro">
          How does it work?
        </h2>

        <ul className="list-disc pl-10 mt-2 text-lg">
          <li>
            An algorithm refines your search to include local terminology.
          </li>
          <li>Google provides a list of relevant spots.</li>
          <li>
            Our post-processing then weeds out any places except those with
            exceptional reviews.
          </li>
        </ul>
        <h2 className="text-3xl font-semibold mt-5 font-family-pixelpro">
          Looking Ahead:
        </h2>
        <p className="text-lg">Our roadmap includes solving challenges like:</p>
        <ul className="list-disc pl-10 mt-2 text-lg">
          <li>
            Adjusting for clubs which often have misleadingly low reviews.
          </li>
          <li>Notifying you about newly opened quality spots in your area.</li>
          <li>Reducing the current gastronomy bias.</li>
        </ul>
        <p className="mt-4 text-lg">
          Your contributions are welcome on our{" "}
          <u>
            <a href="https://github.com/tychografie/tychomaps">GitHub</a>
          </u>{" "}
          to help enhance these features!
        </p>
        <Link
          href="/"
          className="rounded-md inline-block mt-4 bg-[#EEB053] px-6 py-5 hover:bg-black/20"
        >
          Search your next spot
        </Link>
      </div>
    </div>
  )
}
