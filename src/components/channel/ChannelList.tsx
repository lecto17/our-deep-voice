import { Channel } from '@/types/channel';
import ChannelItem from './ChannelItem';

type ChannelListProps = {
  channels: Channel[];
  handleSetActiveChannelId: (channelId: string) => void;
  setIsPasswordModalOpen: (isOpen: boolean) => void;
  handleChannelAction: (
    e: React.MouseEvent<HTMLButtonElement>,
    channelId: string,
    action: 'PARTICIPATE' | 'LEAVE',
    joinedStatus: boolean,
    needsPassword?: boolean,
  ) => void;
  handleParticipateChannel: (channelId: string) => void;
};

const ChannelList = ({
  channels,
  handleSetActiveChannelId,
  setIsPasswordModalOpen,
  handleChannelAction,
  handleParticipateChannel,
}: ChannelListProps) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Where would you like to dive in today?
        </h1>
        <p className="text-text-secondary text-sm">
          Discover communities and share your voice.
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-32">
        {channels.length === 0 ? (
          <div className="col-span-full flex h-64 items-center justify-center bg-surface-subtle rounded-3xl border border-dashed border-gray-300">
            <div className="text-center">
              <div className="text-4xl mb-3">🧊</div>
              <div className="text-text-secondary font-medium mb-1">
                아직 채널이 없어요
              </div>
              <div className="text-text-tertiary text-sm">
                새 채널을 만들어보세요!
              </div>
            </div>
          </div>
        ) : (
          channels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              handleSetActiveChannelId={handleSetActiveChannelId}
              setIsPasswordModalOpen={setIsPasswordModalOpen}
              handleChannelAction={handleChannelAction}
              handleParticipateChannel={handleParticipateChannel}
            />
          ))
        )}
      </ul>
    </div>
  );
};

export default ChannelList;
