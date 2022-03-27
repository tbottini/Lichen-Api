-- CreateTable
CREATE TABLE "_ArtworkToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ArtworkToUser_AB_unique" ON "_ArtworkToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtworkToUser_B_index" ON "_ArtworkToUser"("B");

-- AddForeignKey
ALTER TABLE "_ArtworkToUser" ADD FOREIGN KEY ("A") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtworkToUser" ADD FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
