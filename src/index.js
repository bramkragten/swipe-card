import { LitElement, html, css, unsafeCSS } from "lit";

import Swiper from "swiper/swiper-bundle.esm.js";
import swiperStyle from "swiper/swiper-bundle.css";
import deepcopy from "deep-clone-simple";

const HELPERS = window.loadCardHelpers ? window.loadCardHelpers() : undefined;

window.customCards = window.customCards || [];
window.customCards.push({
  type: "swipe-card",
  name: "Swipe Card",
  description: "A card thats lets you swipe through multiple Lovelace cards.",
});

const computeCardSize = (card) => {
  if (typeof card.getCardSize === "function") {
    return card.getCardSize();
  }
  if (customElements.get(card.localName)) {
    return 1;
  }
  return customElements
    .whenDefined(card.localName)
    .then(() => computeCardSize(card));
};

class SwipeCard extends LitElement {
  static get properties() {
    return {
      _config: {},
      _cards: {},
    };
  }

  static getStubConfig() {
    return { cards: [] };
  }

  shouldUpdate(changedProps) {
    if (changedProps.has("_config") || changedProps.has("_cards")) {
      return true;
    }
    return false;
  }

  static get styles() {
    return css`
      :host {
        --swiper-theme-color: var(--primary-color);
      }
      ${unsafeCSS(swiperStyle)}
    `;
  }

  setConfig(config) {
    if (!config || !config.cards || !Array.isArray(config.cards)) {
      throw new Error("Card config incorrect");
    }
    this._config = config;
    this._parameters = deepcopy(this._config.parameters) || {};
    this._cards = [];
    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(() => {
        if (this.swiper) {
          this.swiper.update();
        }
      });
    }
    this._createCards();
  }

  set hass(hass) {
    this._hass = hass;

    if (!this._cards) {
      return;
    }

    this._cards.forEach((element) => {
      element.hass = this._hass;
    });
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._config && this._hass && this._updated && !this._loaded) {
      this._initialLoad();
    } else if (this.swiper) {
      this.swiper.update();
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    this._updated = true;
    if (this._config && this._hass && this.isConnected && !this._loaded) {
      this._initialLoad();
    } else if (this.swiper) {
      this.swiper.update();
    }
  }

  render() {
    if (!this._config || !this._hass) {
      return html``;
    }

    return html`
      <div
        class="swiper-container"
        dir="${this._hass.translationMetadata.translations[
          this._hass.selectedLanguage || this._hass.language
        ].isRTL || false
          ? "rtl"
          : "ltr"}"
      >
        <div class="swiper-wrapper">${this._cards}</div>
        ${"pagination" in this._parameters
          ? this._config.pagination_style
            ? html`
                <div
                  class="swiper-pagination"
                  style="${this._config.pagination_style}"
                ></div>
              `
            : html` <div class="swiper-pagination"></div> `
          : ""}
        ${"navigation" in this._parameters
          ? html`
              <div class="swiper-button-next"></div>
              <div class="swiper-button-prev"></div>
            `
          : ""}
        ${"scrollbar" in this._parameters
          ? html` <div class="swiper-scrollbar"></div> `
          : ""}
      </div>
    `;
  }

  async _initialLoad() {
    this._loaded = true;

    await this.updateComplete;

    if ("pagination" in this._parameters) {
      if (this._parameters.pagination === null) {
        this._parameters.pagination = {};
      }
      this._parameters.pagination.el =
        this.shadowRoot.querySelector(".swiper-pagination");
    }

    if ("navigation" in this._parameters) {
      if (this._parameters.navigation === null) {
        this._parameters.navigation = {};
      }
      this._parameters.navigation.nextEl = this.shadowRoot.querySelector(
        ".swiper-button-next"
      );
      this._parameters.navigation.prevEl = this.shadowRoot.querySelector(
        ".swiper-button-prev"
      );
    }

    if ("scrollbar" in this._parameters) {
      if (this._parameters.scrollbar === null) {
        this._parameters.scrollbar = {};
      }
      this._parameters.scrollbar.el =
        this.shadowRoot.querySelector(".swiper-scrollbar");
    }

    if ("start_card" in this._config) {
      this._parameters.initialSlide = this._config.start_card - 1;
    }

    this.swiper = new Swiper(
      this.shadowRoot.querySelector(".swiper-container"),
      this._parameters
    );

    if (this._config.reset_after) {
      this.swiper
        .on("slideChange", () => {
          this._setResetTimer();
        })
        .on("click", () => {
          this._setResetTimer();
        })
        .on("touchEnd", () => {
          this._setResetTimer();
        });
    }
  }

  _setResetTimer() {
    if (this._resetTimer) {
      window.clearTimeout(this._resetTimer);
    }
    this._resetTimer = window.setTimeout(() => {
      this.swiper.slideTo(this._parameters.initialSlide || 0);
    }, this._config.reset_after * 1000);
  }

  async _createCards() {
    this._cardPromises = Promise.all(
      this._config.cards.map((config) => this._createCardElement(config))
    );

    this._cards = await this._cardPromises;
    if (this._ro) {
      this._cards.forEach((card) => {
        this._ro.observe(card);
      });
    }
    if (this.swiper) {
      this.swiper.update();
    }
  }

  async _createCardElement(cardConfig) {
    const element = (await HELPERS).createCardElement(cardConfig);
    element.className = "swiper-slide";
    if ("card_width" in this._config) {
      element.style.width = this._config.card_width;
    }
    if (this._hass) {
      element.hass = this._hass;
    }
    element.addEventListener(
      "ll-rebuild",
      (ev) => {
        ev.stopPropagation();
        this._rebuildCard(element, cardConfig);
      },
      {
        once: true,
      }
    );
    return element;
  }

  async _rebuildCard(element, config) {
    const newCard = await this._createCardElement(config);
    element.replaceWith(newCard);
    this._cards.splice(this._cards.indexOf(element), 1, newCard);
    this._ro.observe(newCard);
    this.swiper.update();
  }

  async getCardSize() {
    await this._cardPromises;

    if (!this._cards) {
      return 0;
    }

    const promises = [];

    for (const element of this._cards) {
      promises.push(computeCardSize(element));
    }

    const results = await Promise.all(promises);

    return Math.max(...results);
  }
}

customElements.define("swipe-card", SwipeCard);
console.info(
  "%c   SWIPE-CARD  \n%c Version 5.0.0 ",
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray"
);
