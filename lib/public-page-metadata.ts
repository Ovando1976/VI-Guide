import type { Metadata } from "next";

const SITE_NAME = "USVI Explorer";

type PublicPageMetadataInput = {
  title: string;
  description: string;
  path: `/${string}`;
};

export function buildPublicPageMetadata({
  title,
  description,
  path,
}: PublicPageMetadataInput): Metadata {
  const socialTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url: path,
    },
    twitter: {
      card: "summary",
      title: socialTitle,
      description,
    },
  };
}

export function buildPublicPageLayoutMetadata(
  input: PublicPageMetadataInput,
): Metadata {
  return {
    ...buildPublicPageMetadata(input),
    title: {
      default: input.title,
      template: "%s",
    },
  };
}
