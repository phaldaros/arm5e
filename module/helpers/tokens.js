function getActorsFromTargetedTokens(actor) {
    const targets = game.user.targets;
    if (!targets?.size) {
        return false;
    }

    return Array.from(targets).map(target => target.document._actor)
}

export {
    getActorsFromTargetedTokens,
}