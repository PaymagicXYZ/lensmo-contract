// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.16;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./Domain.sol";

contract TrustedTxModifier is Modifier, Domain {
    event ModifierSetup(
        address indexed initiator,
        address indexed owner,
        address indexed avatar,
        address target
    );

    struct SigParams {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /// @param _owner Address of the owner
    /// @param _avatar Address of the avatar (e.g. a Gnosis Safe)
    /// @param _target Address of the contract that will call exec function
    /// @notice There need to be at least 60 seconds between end of cooldown and expiration
    constructor(
        address _owner,
        address _avatar,
        address _target
    ) {
        bytes memory initParams = abi.encode(
            _owner,
            _avatar,
            _target
        );
        setUp(initParams);
    }

    uint256 public nonce;

    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparator();
    }

    bytes32 private constant CREATE_TRANSACTION_HASH = keccak256("CreateTransaction(address to,uint256 value,bytes data,uint8 operation)");


    function setUp(bytes memory initParams) public override {
        (
            address _owner,
            address _avatar,
            address _target
        ) = abi.decode(
                initParams,
                (address, address, address)
            );
        __Ownable_init();
        require(_avatar != address(0), "Avatar can not be zero address");
        require(_target != address(0), "Target can not be zero address");

        avatar = _avatar;
        target = _target;

        transferOwnership(_owner);
        setupModules();

        emit ModifierSetup(msg.sender, _owner, _avatar, _target);
    }

    /// @dev Executes the next transaction only if the cooldown has passed and the transaction has not expired
    /// @param to Destination address of module transaction
    /// @param value Ether value of module transaction
    /// @param data Data payload of module transaction
    /// @param operation Operation type of module transaction
    /// @param sigParams Split signature of owner
    /// @notice The txIndex used by this function is always 0
    function executeTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        SigParams calldata sigParams
    ) public {
         {
            bytes32 txHash = keccak256(
            abi.encode(
                    CREATE_TRANSACTION_HASH,
                    to,
                    value,
                    data,
                    operation,
                    nonce++
                )
            );
            require(ecrecover(_getDigest(txHash), sigParams.v, sigParams.r, sigParams.s) == owner(), "Owner signature invalid");
        }

        require(exec(to, value, data, operation), "Module transaction failed");
    }

    function setupModules() internal {
        require(
            modules[SENTINEL_MODULES] == address(0),
            "setUpModules has already been called"
        );
        modules[SENTINEL_MODULES] = SENTINEL_MODULES;
    }

}
