import {
  LitElement, html, css, unsafeCSS
} from "lit-element";

import Swiper from "swiper";
import swiperStyle from "swiper/dist/css/swiper.min.css";
import deepcopy from "deep-clone-simple";
import { fireEvent } from "custom-card-helpers";

const CUSTOM_TYPE_PREFIX = "custom:";

class SwipeCard extends LitElement {
  static get properties() {
    return {
      _config: {},
      _cards: {},
      _hass: {}
    };
  }

  static get styles() {
    return [
      css`
        ${unsafeCSS(swiperStyle)}
      `,
      css`
        .swiper-pagination-bullet-active {
          background: var(--primary-color);
        }
        .swiper-pagination-progressbar .swiper-pagination-progressbar-fill {
          background: var(--primary-color);
        }
        .swiper-scrollbar-drag {
          background: var(--primary-color);
        }
        .swiper-button-prev {
          background-image: url("data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 27 44'><path d='M0,22L22,0l2.1,2.1L4.2,22l19.9,19.9L22,44L0,22L0,22L0,22z' fill='var(--primary-color)'/></svg>");
        }
        .swiper-button-next {
          background-image: url("data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 27 44'><path d='M27,22L27,22L5,44l-2.1-2.1L22.8,22L2.9,2.1L5,0L27,22L27,22z' fill='var(--primary-color)'/></svg>");
        }
      `
    ];
  }

  setConfig(config) {
    if (!config || !config.cards || !Array.isArray(config.cards)) {
      throw new Error("Card config incorrect");
    }
    this._config = deepcopy(config);
    this._parameters = this._config.parameters || {};
    this._cards = this._config.cards.map((card) => {
      const element = this._createCardElement(card);
      return element;
    });
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
        <div class="swiper-wrapper">
          ${this._cards}
        </div>
        ${"pagination" in this._parameters
    ? html`
              <div class="swiper-pagination"></div>
            `
    : ""}
        ${"navigation" in this._parameters
    ? html`
              <div class="swiper-button-next"></div>
              <div class="swiper-button-prev"></div>
            `
    : ""}
        ${"scrollbar" in this._parameters
    ? html`
              <div class="swiper-scrollbar"></div>
            `
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
      this._parameters.pagination.el = this.shadowRoot.querySelector(".swiper-pagination");
    }

    if ("navigation" in this._parameters) {
      if (this._parameters.navigation === null) {
        this._parameters.navigation = {};
      }
      this._parameters.navigation.nextEl = this.shadowRoot.querySelector(".swiper-button-next");
      this._parameters.navigation.prevEl = this.shadowRoot.querySelector(".swiper-button-prev");
    }

    if ("scrollbar" in this._parameters) {
      if (this._parameters.scrollbar === null) {
        this._parameters.scrollbar = {};
      }
      this._parameters.scrollbar.el = this.shadowRoot.querySelector(".swiper-scrollbar");
    }

    if ("start_card" in this._config) {
      this._parameters.initialSlide = this._config.start_card - 1;
    }

    this.swiper = new Swiper(this.shadowRoot.querySelector(".swiper-container"), this._parameters);
  }

  _createCardElement(cardConfig) {
    let element;
    let errorConfig;
    if (cardConfig.type.startsWith(CUSTOM_TYPE_PREFIX)) {
      const tag = cardConfig.type.substr(CUSTOM_TYPE_PREFIX.length);

      if (customElements.get(tag)) {
        element = window.document.createElement(`${tag}`);
      } else {
        errorConfig = {
          type: "error",
          error: `Custom element doesn't exist: ${tag}.`,
          cardConfig
        };
        element = window.document.createElement("hui-error-card");
        element.style.display = "None";
        const timer = window.setTimeout(() => {
          element.style.display = "";
        }, 5000);

        customElements.whenDefined(tag).then(() => {
          clearTimeout(timer);
          // HA >= 0.86
          fireEvent(element, "ll-rebuild");
          // HA < 0.86
          fireEvent(element, "rebuild-view");
        });
      }
    } else {
      element = window.document.createElement(`hui-${cardConfig.type}-card`);
    }

    element.className = "swiper-slide";

    if ("card_width" in this._config) {
      element.style.width = this._config.card_width;
    }

    if (errorConfig) {
      element.setConfig(errorConfig);
    } else {
      element.setConfig(cardConfig);
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
        once: true
      }
    );
    return element;
  }

  _rebuildCard(element, config) {
    const newCard = this._createCardElement(config);
    element.replaceWith(newCard);
    this._cards.splice(this._cards.indexOf(element), 1, newCard);
  }

  getCardSize() {
    return 2;
  }
}

customElements.define("swipe-card", SwipeCard);
