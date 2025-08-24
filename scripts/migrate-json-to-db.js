"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
async function main() {
    // 1. Migrate Games
    const gamesPath = path_1.default.join(__dirname, '../data/games.json');
    const gamesData = JSON.parse(await promises_1.default.readFile(gamesPath, 'utf-8'));
    for (const game of gamesData.games) {
        await prisma.game.create({
            data: {
                id: game.id,
                name: game.name,
                description: game.description,
                genre: game.genre,
                robloxLink: game.robloxLink,
                thumbnail: game.thumbnail,
                metrics: game.metrics,
                dates: game.dates,
                owner: game.owner,
                createdAt: game.dates?.created ? new Date(game.dates.created) : undefined,
                updatedAt: game.dates?.lastUpdated ? new Date(game.dates.lastUpdated) : undefined,
            }
        });
    }
    // 2. Migrate Assets
    const assetsPath = path_1.default.join(__dirname, '../data/assets.json');
    const assetsData = JSON.parse(await promises_1.default.readFile(assetsPath, 'utf-8'));
    for (const asset of assetsData.assets) {
        await prisma.asset.create({
            data: {
                id: asset.id,
                name: asset.name,
                type: asset.type,
                status: asset.status,
                robloxId: asset.robloxId,
                creator: asset.creator,
                metadata: asset.metadata,
                versions: asset.versions,
                relationships: asset.relationships,
                createdAt: asset.createdAt ? new Date(asset.createdAt) : undefined,
                updatedAt: asset.updatedAt ? new Date(asset.updatedAt) : undefined,
            }
        });
    }
    // 3. Migrate Playlists
    const playlistsPath = path_1.default.join(__dirname, '../data/playlists.json');
    const playlistsData = JSON.parse(await promises_1.default.readFile(playlistsPath, 'utf-8'));
    for (const playlist of playlistsData.playlists) {
        await prisma.playlist.create({
            data: {
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                type: playlist.type,
                createdBy: playlist.createdBy,
                metadata: playlist.metadata,
                createdAt: playlist.createdAt ? new Date(playlist.createdAt) : undefined,
                updatedAt: playlist.updatedAt ? new Date(playlist.updatedAt) : undefined,
            }
        });
    }
    // 4. Migrate Game Ads
    const adsPath = path_1.default.join(__dirname, '../data/game-ads.json');
    const adsData = JSON.parse(await promises_1.default.readFile(adsPath, 'utf-8'));
    for (const ad of adsData.ads) {
        await prisma.gameAd.create({
            data: {
                id: ad.id,
                gameId: ad.gameId,
                name: ad.name,
                type: ad.type,
                status: ad.status,
                schedule: ad.schedule,
                targeting: ad.targeting,
                metrics: ad.metrics,
                createdAt: ad.createdAt ? new Date(ad.createdAt) : undefined,
                updatedAt: ad.updatedAt ? new Date(ad.updatedAt) : undefined,
            }
        });
    }
}
main()
    .then(() => {
    console.log('Migration complete!');
    return prisma.$disconnect();
})
    .catch((e) => {
    console.error(e);
    return prisma.$disconnect();
});
