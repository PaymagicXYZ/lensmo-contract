pragma solidity ^0.8.0;

contract Domain {
    bytes32 private constant DOMAIN_SEPARATOR_SIGNATURE_HASH =
        keccak256("EIP712Domain(uint256 chainId,address verifyingContract)");
    string private constant EIP191_PREFIX_FOR_EIP712_STRUCTURED_DATA =
        "\x19\x01";

    bytes32 private immutable _DOMAIN_SEPARATOR;
    uint256 private immutable DOMAIN_SEPARATOR_CHAIN_ID;

    function _calculateDomainSeparator(uint256 chainId)
        private
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    DOMAIN_SEPARATOR_SIGNATURE_HASH,
                    chainId,
                    address(this)
                )
            );
    }

    constructor() {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        _DOMAIN_SEPARATOR = _calculateDomainSeparator(
            DOMAIN_SEPARATOR_CHAIN_ID = chainId
        );
    }

    function _domainSeparator() internal view returns (bytes32) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return
            chainId == DOMAIN_SEPARATOR_CHAIN_ID
                ? _DOMAIN_SEPARATOR
                : _calculateDomainSeparator(chainId);
    }

    function _getDigest(bytes32 dataHash)
        internal
        view
        returns (bytes32 digest)
    {
        digest = keccak256(
            abi.encodePacked(
                EIP191_PREFIX_FOR_EIP712_STRUCTURED_DATA,
                _domainSeparator(),
                dataHash
            )
        );
    }
}
