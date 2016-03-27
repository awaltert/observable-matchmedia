﻿import {IMatchMediaChannelFactory} from "../contracts/IMatchMediaChannelFactory";
import {IMatchMediaChannelConfiguration} from "../contracts/IMatchMediaChannelConfiguration";
import {IMatchMediaChannel} from "../contracts/IMatchMediaChannel";
import {Observable} from "rxjs";
import "es6-collections";

export const noopMediaQueryChannel: IMatchMediaChannel<MediaQueryList> = {
    channelName: "",
    mediaQuery: "",
    observable: <Observable<MediaQueryList>> Observable.empty()
};

export default class MatchMediaChannelFactory implements IMatchMediaChannelFactory<MediaQueryList> {
    private _matchMedia: (mediaQuery: string) => MediaQueryList;
    private _valueProducer = (matchMediaEvent) => matchMediaEvent;
    private _createdMediaChannels: Map<string, IMatchMediaChannel<MediaQueryList>>;

    constructor(window: Window) {
        this._matchMedia = MatchMediaChannelFactory.ensureMatchMedia(window);
        this._createdMediaChannels = new Map<string, IMatchMediaChannel<MediaQueryList>>();
    }

    // region static methods
    private  static ensureMatchMedia(window: Window): (mediaQuery: string) => MediaQueryList {
        if (!window.matchMedia) {
            throw new Error("matchMedia must be defined on window");
        }
        return window.matchMedia;
    }
    // endregion

    // region private methods
    private _createObservableBy(list: MediaQueryList): Observable<MediaQueryList> {
        return Observable.fromEventPattern(
            (listener: MediaQueryListListener) => list.addListener(listener),
            (listener: MediaQueryListListener) => list.removeListener(listener),
            this._valueProducer
        );
    }

    private _createMediaChannelObject({channelName, mediaQuery}: IMatchMediaChannelConfiguration) {
        const mediaQueryList = matchMedia(mediaQuery),
            observable = this._createObservableBy(mediaQueryList);

        return {
            channelName,
            mediaQuery,
            observable
        };
    }
    // endregion

    // region interface IMatchMediaChannelFactory implementation
    public create(config: IMatchMediaChannelConfiguration): IMatchMediaChannel<MediaQueryList> {
        let createdMediaChannel: IMatchMediaChannel<MediaQueryList>;
        if (this._createdMediaChannels.has(config.channelName)) {
            return this._createdMediaChannels.get(config.channelName);
        }

        createdMediaChannel = this._createMediaChannelObject(config);
        this._createdMediaChannels.set(createdMediaChannel.channelName, createdMediaChannel);

        return createdMediaChannel;
    }

    public get(channelName: string): IMatchMediaChannel<MediaQueryList> {
        return this._createdMediaChannels.has(channelName) ?
                    this._createdMediaChannels.get(channelName) :
                    noopMediaQueryChannel;
    }

    public has(channelName: string) {
        return this._createdMediaChannels.has(channelName);
    }

    public remove(channelName: string) {
        if (this._createdMediaChannels.has(channelName)) {
            this._createdMediaChannels.delete(channelName);
        }
    }
    // endregion
}