'use client';
import ScrollableBar from '../carousel/ScrollableBar';
import DatePresenter from './DatePresenter';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDateYYYYMMDDWithDash } from '@/utils/utils';

const useDateList = () => {
  const router = useRouter();
  // const dateParam = useSearchParams().get('date');
  // const year = Number(dateParam?.slice(0, 4));
  // const month = Number(dateParam?.slice(4, 6));
  // const day = Number(dateParam?.slice(6, 8));
  // const date = new Date(`${year}-${month}-${day}`);

  const date = new Date();
  const dateParam = useSearchParams().get('date');

  // 주차 별로 고정된 날짜를 출력하는게 좋을지 고민 필요
  const getRecentDates = () => {
    const BEFORE_DAYS = 4;

    return Array.from({ length: 7 }, (_, i) => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() - (BEFORE_DAYS - i));
      return newDate;
    });
  };

  const handleClick = (date: Date) => {
    const today = getDateYYYYMMDDWithDash(date).replaceAll('-', '');
    router.push(`?date=${today}`);
  };

  return { dates: getRecentDates(), dateParam, handleClick };
};

export default function DateList() {
  const { dates, dateParam, handleClick } = useDateList();

  return (
    <ScrollableBar
      // 캐러셀은 하이드레이션 전까지 날짜를 그리지 않으므로 높이를 미리 잡아 아래 피드가 밀리지 않게 한다
      // 70px = 날짜 칸 높이(p-5 40px + text-lg 줄 높이 28px + 테두리 2px)
      containerClass="w-full flex gap-2 min-h-[70px]"
      sliderClass="w-full flex items-center"
      infinite={false}
    >
      {dates.map((_date, idx) => {
        const _formattedDate = getDateYYYYMMDDWithDash(_date).replaceAll(
          '-',
          '',
        );
        return (
          <DatePresenter
            key={idx}
            date={_date}
            onClick={() => handleClick(_date)}
            isSelected={_formattedDate === dateParam}
          />
        );
      })}
    </ScrollableBar>
  );
}
