import { Channel } from '@/types/channel';
import Link from 'next/link';

type ChannelItemProps = {
  channel: Channel;
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

export default function ChannelItem({
  channel,
  handleSetActiveChannelId,
  setIsPasswordModalOpen,
  handleChannelAction,
  handleParticipateChannel,
}: ChannelItemProps) {
  return (
    <li
      key={channel.id}
      className="bg-surface-card border border-surface-subtle shadow-sm hover:shadow-lg transition-all duration-300 rounded-3xl overflow-hidden group h-full flex flex-col"
    >
      <Link
        href={`/channels/${channel.id}`}
        className="flex flex-col h-full p-5"
        onClick={(e) => {
          if (channel.needsPassword && !channel.isJoined) {
            e.preventDefault();
            handleSetActiveChannelId(channel.id);
            setIsPasswordModalOpen(true);
          }
          if (!channel.needsPassword && !channel.isJoined) {
            handleParticipateChannel(channel.id);
          }
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
              channel.isJoined
                ? 'bg-brand-50 text-brand-600'
                : 'bg-surface-subtle text-text-tertiary'
            }`}
          >
            {channel.isJoined ? '✨' : '#'}
          </div>
          {channel.isJoined && (
            <span className="px-2.5 py-1 bg-brand-50 text-brand-600 text-xs font-semibold rounded-full border border-brand-100">
              Active
            </span>
          )}
        </div>

        <h3 className="font-bold text-text-primary text-lg mb-2 group-hover:text-brand-600 transition-colors">
          {channel.name}
        </h3>

        <p className="text-text-secondary text-sm mb-6 flex-1 line-clamp-2">
          {channel.description || 'No description provided.'}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-subtle w-full">
          <div className="flex items-center space-x-3 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              👥 {channel.memberCount}
            </span>
            {channel.needsPassword && (
              <span className="flex items-center gap-1">🔒 Private</span>
            )}
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            {channel.isJoined ? (
              <button
                onClick={(e) =>
                  handleChannelAction(e, channel.id, 'LEAVE', channel.isJoined)
                }
                className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                Leave
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (channel.needsPassword && !channel.isJoined) {
                    handleSetActiveChannelId(channel.id);
                    setIsPasswordModalOpen(true);
                    return;
                  }
                  handleParticipateChannel(channel.id);
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95"
              >
                Join
              </button>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
