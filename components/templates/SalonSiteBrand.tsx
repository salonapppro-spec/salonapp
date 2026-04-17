import type { CSSProperties } from "react";

import type { SalonData } from "@/types/database";

export function salonPublicLogoUrl(tenant: SalonData["tenant"]): string | null {
  const u = tenant.logo_url?.trim();
  return u && /^https?:\/\//i.test(u) ? u : null;
}

type SalonSiteBrandProps = {
  data: SalonData;
  /** Име на салона */
  nameClassName?: string;
  nameStyle?: CSSProperties;
  /** Огледална картинка в хедъра */
  imgClassName?: string;
};

/** Име + опционално лого за хедър на публичния сайт на салона. */
export function SalonSiteBrand(props: SalonSiteBrandProps) {
  const { data, nameClassName = "", nameStyle, imgClassName } = props;
  const { tenant } = data;
  const logo = salonPublicLogoUrl(tenant);
  const imgCls =
    imgClassName ?? "h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/15";

  return (
    <div className="flex min-w-0 items-center gap-3">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- публичен URL от настройките на салона
        <img src={logo} alt="" width={36} height={36} className={imgCls} />
      ) : null}
      <span className={`min-w-0 truncate ${nameClassName}`} style={nameStyle}>
        {tenant.salon_name}
      </span>
    </div>
  );
}
