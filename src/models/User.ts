export interface User {
    id: string;
    googleId: string;
    email: string;
    name: string;
    chessUsername?: string;
    youtubeChannelId: string;
    createdAt: Date;
    updatedAt: Date;
}
