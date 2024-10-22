/* eslint-disable @next/next/no-img-element */
import { memo } from "react"
import Link from "next/link"

export const Footer = memo(() => {
  return (
    <footer className="w-full bg-gray-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start">
        <div className="flex flex-col items-center md:items-start mb-8 md:mb-0">
          <Link href="/">
            <img
              src="/img/polo-maps.svg"
              alt="Polomaps Logo"
              className="w-32 mb-4 filter brightness-0 invert"
            />
          </Link>
          <div className="flex flex-col space-y-2 mb-2 text-center md:text-left">
            <Link href="/privacy-policy" className="text-sm hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-sm hover:underline">
              Terms of Service
            </Link>
            <Link href="/refund-policy" className="text-sm hover:underline">
              Refund Policy
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end">
          <div className="flex space-x-4 mb-4">
            <a
              href="https://www.instagram.com/trypolomaps"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/img/icons/instagram.svg"
                alt="Instagram"
                className="w-6 h-6 invert"
              />
            </a>
          </div>
          <p className="text-sm text-center md:text-right">
            © 2024 Polomaps. All rights reserved.
          </p>
          <p
            className="text-sm italic text-white handwritten opacity-0 transition-opacity duration-1000 mt-2"
            id="handwrittenMessage"
          >
            Love from your Tourguide, Tycho!
          </p>
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = "Footer"
