import { Medium } from "@prisma/client";

//todo rename on MEDIUM
const mediumDict = {
	LIVING_ARTS: Medium.LIVING_ARTS,
	DRAWING: Medium.DRAWING,
	EDITING: Medium.EDITING,
	STAMP: Medium.STAMP,
	INSTALLATION: Medium.INSTALLATION,
	PAINTING: Medium.PAINTING,
	PHOTOGRAPH: Medium.PHOTOGRAPH,
	SCULPTURE: Medium.SCULPTURE,
	STREET_ART: Medium.STREET_ART,
	MIXED_TECHNIQUE: Medium.MIXED_TECHNIQUE,
	AUDIOVISUAL: Medium.AUDIOVISUAL,
};

module.exports = {
    mediumDict
}