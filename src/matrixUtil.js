export function isDmRoom(room) {
    const allMembers = room.currentState.getMembers();
    return allMembers.length === 2; // todo something better
}
